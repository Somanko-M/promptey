import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const RegionModal = ({
  open,
  onSelect,
}: {
  open: boolean;
  onSelect: (region: "india" | "international") => void;
}) => {
  return (
    <Dialog open={open}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Where are you located?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This helps us choose the correct payment gateway for you.
        </p>
        <DialogFooter className="flex gap-4 pt-4 justify-end">
          <Button onClick={() => onSelect("india")}>🇮🇳 India</Button>
          <Button onClick={() => onSelect("international")} variant="outline">
            🌍 International
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegionModal;
