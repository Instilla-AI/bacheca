import BigQueryChat from '@/components/BigQueryChat';
import React from 'react';

export const metadata = {
  title: 'BigQuery Chat | Tailwind Admin',
  description: 'Chat con il tuo database BigQuery usando linguaggio naturale',
};

export default function BigQueryChatPage() {
  return (
    <div className="h-screen overflow-hidden">
      <BigQueryChat />
    </div>
  );
}
