import { supabase } from './supabase'

export interface UploadResult {
  url: string
  path: string
}

export class FileUploadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileUploadError'
  }
}

export async function uploadImage(
  file: File,
  path: string,
  maxSizeMB = 5
): Promise<UploadResult> {
  if (!file.type.startsWith('image/')) {
    throw new FileUploadError('File must be an image')
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    throw new FileUploadError(`Image must be less than ${maxSizeMB}MB`)
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('organization-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw new FileUploadError(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from('organization-images')
    .getPublicUrl(fileName)

  return {
    url: publicUrl,
    path: fileName
  }
}

export async function uploadCarouselImage(
  file: File,
  organizationId: string
): Promise<UploadResult> {
  return uploadImage(file, `${organizationId}/carousel`, 5)
}

export async function uploadLogo(
  file: File,
  organizationId: string
): Promise<UploadResult> {
  const optimized = await resizeImage(file, 400, 400)
  const path = `${organizationId}/logo`

  const existingFiles = await supabase.storage
    .from('organization-images')
    .list(path)

  if (existingFiles.data && existingFiles.data.length > 0) {
    const filesToDelete = existingFiles.data.map(f => `${path}/${f.name}`)
    await supabase.storage
      .from('organization-images')
      .remove(filesToDelete)
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${path}/logo.${fileExt}`

  const { error } = await supabase.storage
    .from('organization-images')
    .upload(fileName, optimized, {
      cacheControl: '3600',
      upsert: true
    })

  if (error) throw new FileUploadError(error.message)

  const { data: { publicUrl } } = supabase.storage
    .from('organization-images')
    .getPublicUrl(fileName)

  return {
    url: publicUrl,
    path: fileName
  }
}

export async function uploadPDF(
  file: File,
  organizationId: string,
  userId: string
): Promise<void> {
  if (file.type !== 'application/pdf') {
    throw new FileUploadError('File must be a PDF')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new FileUploadError('PDF must be less than 10MB')
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${organizationId}/documents/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('organization-files')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) throw new FileUploadError(uploadError.message)

  const { data: { publicUrl } } = supabase.storage
    .from('organization-files')
    .getPublicUrl(fileName)

  const { error: dbError } = await supabase
    .from('org_files')
    .insert({
      organization_id: organizationId,
      file_name: file.name,
      file_url: publicUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: userId
    } as any)

  if (dbError) throw new FileUploadError(dbError.message)
}

export async function uploadGalleryImages(
  files: File[],
  organizationId: string,
  userId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(async (file) => {
    if (!file.type.startsWith('image/')) {
      throw new FileUploadError(`${file.name} is not an image`)
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new FileUploadError(`${file.name} exceeds 5MB`)
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/gallery/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error } = await supabase.storage
      .from('organization-images')
      .upload(fileName, file)

    if (error) throw new FileUploadError(error.message)

    const { data: { publicUrl } } = supabase.storage
      .from('organization-images')
      .getPublicUrl(fileName)

    await supabase
      .from('org_files')
      .insert({
        organization_id: organizationId,
        file_name: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size,
        uploaded_by: userId
      } as any)

    return {
      url: publicUrl,
      path: fileName
    }
  })

  return Promise.all(uploadPromises)
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/storage/v1/object/public/')

    if (pathParts.length < 2) {
      throw new FileUploadError('Invalid file URL')
    }

    const [bucket, ...fileParts] = pathParts[1].split('/')
    const filePath = fileParts.join('/')

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw new FileUploadError(error.message)
  } catch (error) {
    if (error instanceof FileUploadError) throw error
    throw new FileUploadError('Failed to delete file')
  }
}

async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to resize image'))
          }
        },
        file.type,
        0.9
      )

      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
