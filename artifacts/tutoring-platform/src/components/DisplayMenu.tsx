import { Settings2 } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { DisplayControls } from "./DisplayControls";

// Always-visible header control for display & accessibility preferences.
// Deliberately available to logged-out visitors too — readability settings
// must not be gated behind sign-in.
export function DisplayMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Display and accessibility settings"
          data-testid="button-display-menu"
        >
          <Settings2 className="h-5 w-5" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="mb-3">
          <p className="font-serif text-sm font-semibold">Display &amp; accessibility</p>
          <p className="text-xs text-muted-foreground">
            Saved on this device.
          </p>
        </div>
        <DisplayControls />
      </PopoverContent>
    </Popover>
  );
}
