import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import type { CheckInSettings } from "@/types/research";
import { toast } from "sonner";

interface SettingsViewProps {
  checkInSettings: CheckInSettings;
  onUpdateCheckTime: (time: string) => void;
  onExportJSON: () => void;
  onImportJSON: (json: string) => boolean;
  onExportCSV: () => void;
}

export function SettingsView({ checkInSettings, onUpdateCheckTime, onExportJSON, onImportJSON, onExportCSV }: SettingsViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = onImportJSON(ev.target?.result as string);
      if (ok) toast("Backup restored. Welcome back.");
      else toast("Hmm, that file didn't look right. Try another one.");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="max-w-md space-y-8">
      <div>
        <h2 className="font-serif text-lg font-semibold mb-4">Daily check-in</h2>
        <div className="card-gentle p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            When you open the app after this time, you'll see a gentle summary of what's ahead.
          </p>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">Check-in time</label>
            <Input
              type="time"
              value={checkInSettings.checkTime}
              onChange={(e) => onUpdateCheckTime(e.target.value)}
              className="w-32"
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-serif text-lg font-semibold mb-4">Backup & export</h2>
        <div className="card-gentle p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Your data lives in this browser. Back it up to keep it safe.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { onExportJSON(); toast("Backup saved."); }}>
              <Download className="w-3.5 h-3.5" /> Export JSON
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" /> Import JSON
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { onExportCSV(); toast("CSV exported."); }}>
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export CSV
            </Button>
          </div>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
      </div>
    </div>
  );
}
