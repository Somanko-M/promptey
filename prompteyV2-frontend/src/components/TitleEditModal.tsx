import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const TitleEditModal = ({
  open,
  defaultValue,
  onCancel,
  onSave,
}: {
  open: boolean;
  defaultValue: string;
  onCancel: () => void;
  onSave: (newTitle: string) => void;
}) => {
  const [value, setValue] = useState(defaultValue);

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle>Edit Project Title</DialogTitle>
        </DialogHeader>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(value)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TitleEditModal;
