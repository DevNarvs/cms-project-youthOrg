import { useState, useEffect } from 'react';
import { usePalette } from '@/hooks/usePalette';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Palette, Download, Upload, RefreshCw } from 'lucide-react';
import type { ColorPalette, ColorShades, ColorName } from '@/types/palette';

export function PaletteManager() {
  const { palette, loading, updatePalette, exportPalette, refreshPalette } = usePalette();
  const { user, isAdmin } = useAuth();
  const [editedPalette, setEditedPalette] = useState<ColorPalette>(palette);
  const [saving, setSaving] = useState(false);
  const [activeColor, setActiveColor] = useState<ColorName>('primary');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedPalette(palette);
  }, [palette]);

  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
        Only administrators can manage the global color palette.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner />
      </div>
    );
  }

  const handleColorChange = (shade: string, value: string) => {
    setEditedPalette((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [activeColor]: {
          ...prev.colors[activeColor],
          [shade as unknown as keyof ColorShades]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updatePalette(editedPalette, user.id);
      setHasChanges(false);
      alert('Palette saved successfully! Changes are live.');
    } catch (error) {
      alert(`Failed to save palette: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setEditedPalette(palette);
    setHasChanges(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text) as ColorPalette;
      setEditedPalette(imported);
      setHasChanges(true);
    } catch (error) {
      alert('Invalid palette file. Please upload a valid JSON file.');
    }
  };

  const handleExport = async () => {
    try {
      await exportPalette();
    } catch (error) {
      alert('Failed to export palette');
    }
  };

  const colorNames: ColorName[] = [
    'primary',
    'secondary',
    'accent',
    'neutral',
    'success',
    'warning',
    'error',
  ];

  const shades = [
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    '950',
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Palette className="h-6 w-6" />
            Global Color Palette
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage site-wide color scheme with CSS variables
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <Button variant="outline" size="sm" onClick={refreshPalette}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {colorNames.map((name) => (
          <button
            key={name}
            onClick={() => setActiveColor(name)}
            className={`px-4 py-2 rounded-t transition capitalize whitespace-nowrap ${
              activeColor === name
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{activeColor} Color Shades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shades.map((shade) => (
              <div key={shade}>
                <Label htmlFor={`${activeColor}-${shade}`} className="text-sm font-medium">
                  {activeColor}-{shade}
                </Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id={`${activeColor}-${shade}`}
                    type="color"
                    value={editedPalette.colors[activeColor][shade]}
                    onChange={(e) => handleColorChange(shade, e.target.value)}
                    className="w-16 h-10 cursor-pointer p-1"
                  />
                  <Input
                    type="text"
                    value={editedPalette.colors[activeColor][shade]}
                    onChange={(e) => handleColorChange(shade, e.target.value)}
                    className="flex-1 font-mono text-sm"
                    placeholder="#000000"
                  />
                </div>
                <div
                  className="h-12 rounded mt-2 border"
                  style={{ backgroundColor: editedPalette.colors[activeColor][shade] }}
                  title={editedPalette.colors[activeColor][shade]}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            You have unsaved changes. Changes will apply site-wide immediately after saving.
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? 'Saving...' : 'Save Palette'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Color Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {colorNames.map((name) => (
              <div key={name} className="space-y-1">
                <p className="text-xs font-medium capitalize text-center truncate">{name}</p>
                {shades.map((shade) => (
                  <div
                    key={shade}
                    className="h-8 rounded border"
                    style={{ backgroundColor: editedPalette.colors[name][shade] }}
                    title={`${name}-${shade}: ${editedPalette.colors[name][shade]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Component Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <Button className="bg-primary-500 hover:bg-primary-600">Primary</Button>
              <Button className="bg-secondary-500 hover:bg-secondary-600">Secondary</Button>
              <Button className="bg-accent-500 hover:bg-accent-600">Accent</Button>
              <Button className="bg-success-500 hover:bg-success-600">Success</Button>
              <Button className="bg-warning-500 hover:bg-warning-600">Warning</Button>
              <Button className="bg-error-500 hover:bg-error-600">Error</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="p-6 rounded-lg"
                style={{ backgroundColor: editedPalette.colors.primary[500], color: '#ffffff' }}
              >
                <h3 className="text-xl font-bold mb-2">Primary Background</h3>
                <p>Text on primary color</p>
              </div>
              <div
                className="p-6 rounded-lg"
                style={{ backgroundColor: editedPalette.colors.secondary[500], color: '#ffffff' }}
              >
                <h3 className="text-xl font-bold mb-2">Secondary Background</h3>
                <p>Text on secondary color</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
