import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  data: {
    isotope: string;
    activity: string;
    unit: string;
    time: string;
    patientId?: string;
  };
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ data }) => {
  const qrValue = JSON.stringify(data);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-semibold text-slate-100">QR Code Étiquette</h2>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="p-4 bg-white rounded-xl shadow-inner">
          <QRCodeSVG 
            value={qrValue} 
            size={150}
            level="H"
            includeMargin={false}
          />
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">{data.isotope}</p>
          <p className="text-lg font-mono font-bold text-emerald-400">{data.activity} {data.unit}</p>
          <p className="text-[10px] text-slate-500 italic">Généré à {data.time}</p>
        </div>

        <button 
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
          onClick={() => {
            const svg = document.querySelector('svg');
            if (svg) {
              const svgData = new XMLSerializer().serializeToString(svg);
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `RadCalc_QR_${data.isotope}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
              };
              img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
            }
          }}
        >
          <Download className="w-4 h-4" /> Télécharger PNG
        </button>
      </div>
    </div>
  );
};
