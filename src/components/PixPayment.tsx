import React, { useState, useRef } from 'react';
import { QrCode, Copy, Check, Upload, FileImage, FileText, CheckCircle2 } from 'lucide-react';
import { StoreSettings } from '../types';

interface PixPaymentProps {
  total: number;
  settings: StoreSettings;
  onReceiptUploaded: (base64: string, filename: string) => void;
  onCheckoutComplete: () => void;
}

export default function PixPayment({
  total,
  settings,
  onReceiptUploaded,
  onCheckoutComplete
}: PixPaymentProps) {
  const [copied, setCopied] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate standard BR Code Copy and Paste value
  const formattedAmount = total.toFixed(2);
  const pixKey = settings.pixKey || '01986157360';
  const name = settings.pixReceiverName || 'Lanchebem';
  const city = settings.pixCity || 'Coroata';
  
  // Custom synthetic PIX Copy&Paste raw structural data
  const staticPixCode = `00020101021226580014br.gov.bcb.pix0114${pixKey}5204000053039865405${formattedAmount}5802BR5915${name.substring(0, 15)}6007${city.substring(0, 7)}62070503***6304CA1F`;

  const handleCopy = () => {
    navigator.clipboard.writeText(staticPixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert File to Base64
  const processFile = (file: File) => {
    setReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setReceiptPreview(base64);
      onReceiptUploaded(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const openFileExplorer = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-zinc-850 p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-6 text-left shadow-sm">
      
      {/* Visual QR Code and pricing indicator */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900">
        <span className="text-[10px] text-rose-500 uppercase font-black tracking-widest bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-full border border-rose-500/10">
          Pagamento Instantâneo via PIX
        </span>
        <div className="text-2xl sm:text-3xl font-black text-rose-600">
          R$ {formattedAmount}
        </div>
        
        {/* Dynamic Vector Matrix resembling a real QR Code */}
        <div className="relative w-44 h-44 bg-white p-3.5 border-4 border-zinc-150 rounded-2xl shadow-inner group">
          <svg viewBox="0 0 100 100" className="w-full h-full text-zinc-900">
            {/* Standard QR Code corner markers */}
            <rect x="0" y="0" width="22" height="22" fill="currentColor" rx="2" />
            <rect x="3" y="3" width="16" height="16" fill="white" rx="1.5" />
            <rect x="6" y="6" width="10" height="10" fill="currentColor" rx="1" />

            <rect x="78" y="0" width="22" height="22" fill="currentColor" rx="2" />
            <rect x="81" y="3" width="16" height="16" fill="white" rx="1.5" />
            <rect x="84" y="6" width="10" height="10" fill="currentColor" rx="1" />

            <rect x="0" y="78" width="22" height="22" fill="currentColor" rx="2" />
            <rect x="3" y="81" width="16" height="16" fill="white" rx="1.5" />
            <rect x="6" y="84" width="10" height="10" fill="currentColor" rx="1" />
            
            {/* Center decorative target representing PIX logo */}
            <rect x="44" y="44" width="12" height="12" fill="#32b3a2" rx="3" />
            <polygon points="50,46,54,50,50,54,46,50" fill="white" />

            {/* Generated matrix block structure */}
            <path d="M 30,5 H 40 V 10 H 30 Z" fill="currentColor" />
            <path d="M 45,0 H 55 V 5 H 45 Z" fill="currentColor" />
            <path d="M 60,8 H 70 V 15 H 60 Z" fill="currentColor" />
            <path d="M 35,16 H 45 V 23 H 35 Z" fill="currentColor" />
            
            <path d="M 5,30 H 15 V 35 H 5 Z" fill="currentColor" />
            <path d="M 22,30 H 35 V 38 H 22 Z" fill="currentColor" />
            <path d="M 42,30 H 60 V 35 H 42 Z" fill="#32b3a2" />
            <path d="M 65,28 H 75 V 35 H 65 Z" fill="currentColor" />
            
            <path d="M 30,45 H 38 V 52 H 30 Z" fill="currentColor" />
            <path d="M 5,48 H 15 V 55 H 5 Z" fill="currentColor" />
            <path d="M 18,52 H 26 V 60 H 18 Z" fill="currentColor" />
            <path d="M 60,45 H 70 V 52 H 60 Z" fill="currentColor" />
            
            <path d="M 32,62 H 45 V 70 H 32 Z" fill="currentColor" />
            <path d="M 50,62 H 65 V 70 H 50 Z" fill="currentColor" />
            <path d="M 72,56 H 88 V 65 H 72 Z" fill="currentColor" />
            <path d="M 10,65 H 25 V 72 H 10 Z" fill="currentColor" />
            
            <path d="M 30,78 H 40 V 88 H 30 Z" fill="currentColor" />
            <path d="M 45,82 H 58 V 88 H 45 Z" fill="currentColor" />
            <path d="M 65,75 H 75 V 90 H 65 Z" fill="#32b3a2" />
            <path d="M 82,75 H 95 V 82 H 82 Z" fill="currentColor" />
            <path d="M 88,85 H 98 V 98 H 88 Z" fill="currentColor" />
          </svg>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium max-w-[240px]">
          Abra o aplicativo do seu banco, escolha <strong>Pagar com QR Code</strong> e aponte a câmera.
        </p>
      </div>
      
      {/* Warning: No scheduled PIX */}
      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-amber-700 dark:text-amber-400 text-xs font-semibold leading-relaxed animate-fade-in">
        <span className="text-base shrink-0 mt-0.5">⚠️</span>
        <div className="space-y-0.5">
          <p className="font-extrabold uppercase tracking-wider text-[10px] text-amber-800 dark:text-amber-300">Aviso: Não Aceitamos PIX Agendado</p>
          <p className="opacity-90 leading-relaxed text-[11px]">Por favor, efetue o pagamento de forma imediata. Pedidos com comprovante de agendamento não serão aprovados ou preparados.</p>
        </div>
      </div>

      {/* Copy-Paste area */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-650 dark:text-zinc-350 uppercase tracking-wider block">
          Ou Copie a Chave "Copia e Cola" do PIX:
        </label>
        <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <input
            type="text"
            readOnly
            value={staticPixCode}
            className="flex-1 bg-transparent text-xs font-mono truncate text-zinc-800 dark:text-zinc-200 focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className={`p-2 rounded-xl transition-all ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 hover:bg-rose-100'
            }`}
            id="pix-copy-btn"
            title="Copiar código PIX"
          >
            {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
          </button>
        </div>
        {copied && (
          <span className="text-[11px] font-bold text-green-600 flex items-center justify-end gap-1">
            ✓ Código PIX copiado com sucesso!
          </span>
        )}
      </div>

      {/* Proof of Payment attachment Drag-and-Drop Area */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-zinc-650 dark:text-zinc-350 uppercase tracking-wider block">
          Anexe ou tire foto do Comprovante PIX (Não aceitamos PIX Agendado) *
        </label>
        
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={openFileExplorer}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer flex flex-col items-center justify-center space-y-2 transition-all relative overflow-hidden min-h-[140px] ${
            dragActive
              ? 'border-rose-550 bg-rose-50/20 dark:bg-rose-950/10'
              : 'border-zinc-300 dark:border-zinc-750 hover:border-rose-450 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
          }`}
          id="pix-dropzone"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleChange}
            accept="image/*,application/pdf"
            className="hidden"
          />

          {receiptPreview ? (
            <div className="space-y-4 w-full">
              {receiptFile?.type.includes('pdf') ? (
                <div className="flex flex-col items-center justify-center space-y-1 py-4 text-rose-600">
                  <FileText className="w-12 h-12" />
                  <span className="text-xs font-bold truncate max-w-xs">{receiptFile.name}</span>
                </div>
              ) : (
                <div className="relative inline-block w-full max-h-[160px] overflow-hidden rounded-xl border">
                  <img
                    src={receiptPreview}
                    alt="Pré-visualização do comprovante"
                    className="w-full object-contain max-h-[160px]"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-xs font-bold text-white bg-black/80 px-2.5 py-1.5 rounded-full uppercase tracking-wider">
                      Alterar Arquivo
                    </span>
                  </div>
                </div>
              )}
              
              <div className="text-center">
                <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-950/40 border border-green-500/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 fill-green-600 text-white" />
                  Comprovante anexado
                </span>
                <p className="text-[11px] text-zinc-500 mt-1 truncate max-w-[200px] mx-auto">
                  {receiptFile?.name}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 mb-2">
                <Upload className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-350">
                Arraste seu comprovante para cá ou clique para anexar
              </p>
              <p className="text-[10px] text-zinc-405 font-medium">
                Suporta imagens (PNG, JPG, JPEG) ou arquivo PDF
              </p>
            </>
          )}
        </div>
      </div>

      {/* Submit checkout redirect button */}
      <button
        onClick={onCheckoutComplete}
        disabled={!receiptPreview}
        className={`w-full p-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
          receiptPreview
            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/15'
            : 'bg-zinc-150 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
        }`}
        id="pix-finish-btn"
      >
        <CheckCircle2 className="w-5 h-5" />
        <span>Enviar Comprovante e Finalizar</span>
      </button>

      {!receiptPreview && (
        <p className="text-[11px] text-zinc-450 dark:text-zinc-400 font-medium text-center italic">
          *Por favor, anexe o comprovante acima para liberar a finalização e liberação do pedido.
        </p>
      )}

    </div>
  );
}
