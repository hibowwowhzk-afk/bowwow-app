"use client";

import * as React from "react";
import { Button } from "@/app/components/ui/RequestButton";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
};

export const ApproveModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [message, setMessage] = React.useState("");

  React.useEffect(() => {
    if (isOpen) {
      setMessage(""); // モーダルオープン時にメッセージクリア
    }
  }, [isOpen]);

  const handleSend = () => {
    onSubmit(message);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
          <h2 className="text-lg font-semibold mb-4">承認時の一言メッセージ</h2>
          <textarea
            className="w-full border rounded-md p-2 text-sm resize-none"
            rows={4}
            maxLength={255}
            placeholder="一言メッセージを入力してください（任意）"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              キャンセル
            </Button>
            <Button onClick={handleSend}>送信</Button>
          </div>
        </div>
      </div>
    </>
  );
};