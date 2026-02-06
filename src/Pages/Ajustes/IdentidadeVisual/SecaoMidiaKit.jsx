// src/Pages/Ajustes/IdentidadeVisual/SecaoMidiaKit.jsx
import React, { useRef, useState } from "react";
import { Download, QrCode, Mail, FileImage, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-toastify";

export default function SecaoMidiaKit({ config, fazendaId }) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef(null);

  const urlAcesso = `https://smartcow.app/f/${fazendaId || 'exemplo'}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(urlAcesso);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `qrcode-fazenda-${fazendaId}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      {/* QR Code */}
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          QR Code da Fazenda
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
          Compartilhe acesso rápido para técnicos e visitantes.
        </p>

        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <div 
            ref={qrRef}
            style={{
              padding: 24,
              background: "#fff",
              borderRadius: 16,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
            }}
          >
            <QRCodeSVG 
              value={urlAcesso}
              size={180}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: config.logo || "",
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "#374151" }}>
                Link de Acesso Rápido
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={urlAcesso}
                  readOnly
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    fontSize: 14,
                    background: "#f8fafc",
                  }}
                />
                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: "10px 16px",
                    background: copied ? "#d1fae5" : "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    cursor: "pointer",
                    color: copied ? "#065f46" : "#374151",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleDownloadQR}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  background: config.corPrimaria,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Download size={18} /> Baixar QR Code
              </button>
            </div>

            <p style={{ marginTop: 16, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              Imprima o QR Code e cole no galpão, escritório ou envie para técnicos. 
              Ao escanear, o usuário será direcionado para a página de acesso da fazenda.
            </p>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "#e2e8f0" }} />

      {/* Assinatura de Email */}
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          Assinatura de E-mail
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
          Padronize a comunicação enviada pelo sistema.
        </p>

        <div style={{
          padding: 24,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          fontFamily: "Arial, sans-serif",
        }}>
          <div style={{ borderLeft: `4px solid ${config.corPrimaria}`, paddingLeft: 16 }}>
            <strong style={{ color: "#0f172a", fontSize: 16 }}>Fazenda Exemplo</strong>
            <br />
            <span style={{ color: "#64748b", fontSize: 14 }}>Sistema SmartCow</span>
            <br /><br />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <span style={{ 
                padding: "4px 8px", 
                background: config.corPrimaria, 
                color: "#fff", 
                borderRadius: 4,
                fontSize: 12,
              }}>
                Gestão Rural
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <button
            onClick={() => toast.info("Template copiado para área de transferência")}
            style={{
              padding: "10px 20px",
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Mail size={18} /> Copiar Template
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: "#e2e8f0" }} />

      {/* Banner para Relatórios */}
      <div>
        <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
          Banner para Relatórios
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b" }}>
          Imagem de cabeçalho para PDFs e relatórios impressos.
        </p>

        <div style={{
          width: "100%",
          height: 150,
          borderRadius: 12,
          border: "2px dashed #cbd5e1",
          background: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          gap: 8,
        }}>
          <FileImage size={32} color="#94a3b8" />
          <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>
            Adicionar banner (1200x300px)
          </span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            PNG ou JPG, máximo 2MB
          </span>
        </div>
      </div>
    </div>
  );
}