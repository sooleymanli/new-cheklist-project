import { Modal, Spin, Button } from 'antd';
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons';
import { useGetQrByEntityQuery, useGetQrImageQuery } from '../qr.api';

interface Props {
  entityType: string;
  entityId: string | null;
  onClose: () => void;
}

export function QrModal({ entityType, entityId, onClose }: Props) {
  const { data: qrCode } = useGetQrByEntityQuery(
    { entityType, entityId: entityId! },
    { skip: !entityId }
  );
  const { data: imageUrl, isLoading } = useGetQrImageQuery(qrCode?.id!, {
    skip: !qrCode?.id,
  });

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.download = `qr-${qrCode?.code}.png`;
    link.href = imageUrl;
    link.click();
  };

  const handlePrint = () => {
    if (!imageUrl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>QR: ${qrCode?.code}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif}img{max-width:300px}p{margin-top:12px;font-size:14px;color:#333}</style>
      </head><body>
      <img src="${imageUrl}" />
      <p>${qrCode?.code}</p>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <Modal
      title={`QR Code: ${qrCode?.code || ''}`}
      open={!!entityId}
      onCancel={onClose}
            mask={{ enabled: true, blur: true }}

      footer={[
        <Button key="print" icon={<PrinterOutlined />} onClick={handlePrint} disabled={!imageUrl}>
          Çap et
        </Button>,
        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownload} disabled={!imageUrl}>
          Yüklə
        </Button>,
        <Button key="close" onClick={onClose}>Bağla</Button>,
      ]}
    >
      <div style={{ textAlign: 'center', padding: 24 }}>
        {isLoading ? (
          <Spin size="large" />
        ) : imageUrl ? (
          <img src={imageUrl} alt="QR Code" style={{ maxWidth: 300 }} />
        ) : (
          <p>QR kod tapılmadı</p>
        )}
      </div>
    </Modal>
  );
}
