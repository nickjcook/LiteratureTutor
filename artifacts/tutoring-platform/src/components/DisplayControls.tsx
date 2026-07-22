import { Sun, Moon, Monitor, Contrast, Eye, Type } from "lucide-react";
import { usePreferences } from "@/lib/preferences";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

// The actual display/accessibility controls. Rendered inside DisplayMenu's
// popover, but kept standalone so it can be embedded elsewhere (e.g. a full
// settings page) without the popover chrome.
export function DisplayControls() {
  const {
    theme,
    setTheme,
    textSize,
    setTextSize,
    contrast,
    setContrast,
    colorBlind,
    setColorBlind,
    reset,
  } = usePreferences();

  return (
    <div className="space-y-5" data-testid="display-controls">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Sun className="h-3.5 w-3.5" aria-hidden /> Theme
        </Label>
        <ToggleGroup
          type="single"
          value={theme}
          onValueChange={(v) => v && setTheme(v as typeof theme)}
          className="grid grid-cols-3 gap-1"
        >
          <ToggleGroupItem value="light" aria-label="Light theme" data-testid="theme-light">
            <Sun className="mr-1.5 h-4 w-4" aria-hidden /> Light
          </ToggleGroupItem>
          <ToggleGroupItem value="dark" aria-label="Dark theme" data-testid="theme-dark">
            <Moon className="mr-1.5 h-4 w-4" aria-hidden /> Dark
          </ToggleGroupItem>
          <ToggleGroupItem value="system" aria-label="Match system theme" data-testid="theme-system">
            <Monitor className="mr-1.5 h-4 w-4" aria-hidden /> Auto
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Type className="h-3.5 w-3.5" aria-hidden /> Text size
        </Label>
        <ToggleGroup
          type="single"
          value={textSize}
          onValueChange={(v) => v && setTextSize(v as typeof textSize)}
          className="grid grid-cols-3 gap-1"
        >
          <ToggleGroupItem value="normal" aria-label="Normal text size" data-testid="text-normal">
            Normal
          </ToggleGroupItem>
          <ToggleGroupItem value="large" aria-label="Large text size" data-testid="text-large">
            <span className="text-base">Large</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="xlarge" aria-label="Largest text size" data-testid="text-xlarge">
            <span className="text-lg">Largest</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor="pref-contrast"
          className="flex items-center gap-2 text-sm font-normal"
        >
          <Contrast className="h-4 w-4 text-muted-foreground" aria-hidden />
          High contrast
        </Label>
        <Switch
          id="pref-contrast"
          checked={contrast === "high"}
          onCheckedChange={(on) => setContrast(on ? "high" : "normal")}
          data-testid="toggle-contrast"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Label
          htmlFor="pref-colorblind"
          className="flex items-center gap-2 text-sm font-normal"
        >
          <Eye className="h-4 w-4 text-muted-foreground" aria-hidden />
          Colour-blind palette
        </Label>
        <Switch
          id="pref-colorblind"
          checked={colorBlind === "on"}
          onCheckedChange={(on) => setColorBlind(on ? "on" : "off")}
          data-testid="toggle-colorblind"
        />
      </div>

      <div className="flex justify-end border-t pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-8 text-xs text-muted-foreground"
          data-testid="button-reset-display"
        >
          Reset to defaults
        </Button>
      </div>
    </div>
  );
}
