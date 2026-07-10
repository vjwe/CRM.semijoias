import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, RefreshCw, HelpCircle, Download } from "lucide-react";

interface CSVImporterProps {
  onImportComplete: (importedCount: number) => void;
}

export default function CSVImporter({ onImportComplete }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({
    name: -1,
    nickname: -1,
    email: -1,
    phone: -1,
    value: -1,
    stage: -1,
    source: -1,
  });
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse CSV helper in pure TypeScript (handles quotes, commas, semicolon, etc.)
  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/);
    const result: string[][] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const row: string[] = [];
      let insideQuote = false;
      let entry = "";
      
      // Determine separator: comma or semicolon (popular in Brazilian Excel exports)
      const separator = line.includes(";") && !line.includes(",") ? ";" : ",";

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === separator && !insideQuote) {
          row.push(entry.trim());
          entry = "";
        } else {
          entry += char;
        }
      }
      row.push(entry.trim());
      result.push(row);
    }
    return result;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setSuccessMsg("");
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Por favor, selecione apenas arquivos formato .csv");
      return;
    }

    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setError("O arquivo CSV está vazio.");
          return;
        }

        const headers = parsed[0];
        const rows = parsed.slice(1);
        
        setCsvHeaders(headers);
        setCsvRows(rows);

        // Auto-detect mappings based on header keywords
        const newMapping: Record<string, number> = {
          name: -1, nickname: -1, email: -1, phone: -1, value: -1, stage: -1, source: -1
        };

        headers.forEach((h, index) => {
          const lower = h.toLowerCase().trim();
          if (lower.includes("nome") || lower.includes("name") || lower.includes("cliente")) {
            newMapping.name = index;
          } else if (lower.includes("apelido") || lower.includes("nickname") || lower.includes("chamado") || lower.includes("empresa") || lower.includes("company")) {
            newMapping.nickname = index;
          } else if (lower.includes("email") || lower.includes("e-mail") || lower.includes("mail")) {
            newMapping.email = index;
          } else if (lower.includes("telefone") || lower.includes("tel") || lower.includes("phone") || lower.includes("celular") || lower.includes("whats")) {
            newMapping.phone = index;
          } else if (lower.includes("valor") || lower.includes("value") || lower.includes("finan") || lower.includes("orcamento")) {
            newMapping.value = index;
          } else if (lower.includes("etapa") || lower.includes("stage") || lower.includes("fase") || lower.includes("status")) {
            newMapping.stage = index;
          } else if (lower.includes("origem") || lower.includes("source") || lower.includes("canal")) {
            newMapping.source = index;
          }
        });

        setMapping(newMapping);
      } catch (err) {
        setError("Erro ao ler e processar o arquivo CSV.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (!droppedFile.name.endsWith(".csv")) {
      setError("Apenas arquivos CSV são aceitos.");
      return;
    }

    if (fileInputRef.current) {
      // Set the file input files programmatically so standard trigger is synchronized
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      fileInputRef.current.files = dataTransfer.files;
      // Trigger onChange
      const changeEvent = new Event('change', { bubbles: true });
      fileInputRef.current.dispatchEvent(changeEvent);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleMappingChange = (field: string, columnIndex: number) => {
    setMapping(prev => ({
      ...prev,
      [field]: columnIndex
    }));
  };

  const executeImport = async () => {
    setError("");
    if (mapping.name === -1) {
      setError("É obrigatório mapear ao menos o campo 'Nome' para importar.");
      return;
    }

    setIsUploading(true);

    try {
      // Convert rows to lead schema based on mapped indices
      const importedLeads = csvRows.map((row) => {
        const getValueOfMappedIndex = (idx: number) => {
          if (idx === -1 || idx >= row.length) return "";
          return row[idx];
        };

        return {
          name: getValueOfMappedIndex(mapping.name),
          nickname: getValueOfMappedIndex(mapping.nickname),
          email: getValueOfMappedIndex(mapping.email),
          phone: getValueOfMappedIndex(mapping.phone),
          value: Number(getValueOfMappedIndex(mapping.value).replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
          stage: getValueOfMappedIndex(mapping.stage).toLowerCase() || "prospect",
          source: getValueOfMappedIndex(mapping.source) || "CSV Import",
        };
      });

      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importedLeads })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMsg(`Sucesso! ${result.count} leads importados para o seu CRM.`);
        onImportComplete(result.count);
        // Clear state
        setFile(null);
        setCsvHeaders([]);
        setCsvRows([]);
      } else {
        setError("Ocorreu um erro ao enviar os dados para o servidor.");
      }
    } catch (err) {
      setError("Erro ao realizar importação em lote.");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nome,Empresa,Email,Telefone,Valor,Etapa,Origem\n" + 
      "Alice Oliveira,Studio Design,alice@studiodesign.com,11999991111,8500,prospect,Facebook Ads\n" +
      "Bruno Ramos,Padaria Pao Quente,bruno@paoquente.com.br,21988882222,4200,contacted,Google Ads\n" +
      "Carla Dias,FarmaMais,carla@farmamais.com,31977773333,12000,qualified,Indicacao";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "modelo_leads_crm.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-wide">Importador de Leads (CSV)</h3>
          <p className="text-[11px] text-slate-400">Arraste seus contatos ou faça o mapeamento flexível de colunas</p>
        </div>
        <button
          onClick={downloadSampleCSV}
          className="text-xs text-slate-600 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-50 transition-all flex items-center space-x-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Baixar Modelo CSV</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-700 text-xs animate-pulse">
          <Check className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* CSV Drag & Drop Upload Zone */}
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
          className="border-2 border-dashed border-slate-200 hover:border-emerald-500 bg-slate-50/50 hover:bg-slate-50 p-8 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <div className="p-3.5 bg-slate-100 rounded-full text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-colors">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Arraste o arquivo CSV aqui ou clique para selecionar</p>
            <p className="text-[10px] text-slate-400 mt-1">Suporta arquivos delimitados por vírgula (,) ou ponto e vírgula (;)</p>
          </div>
        </div>
      ) : (
        /* CSV Column Mapper Panel */
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-700 font-medium">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>{file.name} (detectamos {csvRows.length} leads em potencial)</span>
            </div>
            <button
              onClick={() => {
                setFile(null);
                setCsvHeaders([]);
                setCsvRows([]);
              }}
              className="text-xs text-rose-600 font-bold hover:underline"
            >
              Remover arquivo
            </button>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl">
            <h4 className="text-xs font-bold text-amber-800 flex items-center space-x-1">
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Mapeamento Inteligente de Colunas</span>
            </h4>
            <p className="text-[10px] text-amber-700 mt-1">
              Selecione qual coluna do seu arquivo CSV corresponde a cada campo do CRM. O sistema tentou mapear de forma inteligente.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Field Mappings */}
            {[
              { id: "name", label: "Nome do Lead (Obrigatório)", key: "name" },
              { id: "email", label: "E-mail", key: "email" },
              { id: "phone", label: "Telefone / WhatsApp", key: "phone" },
              { id: "nickname", label: "Como deve ser chamado (Apelido)", key: "nickname" },
              { id: "value", label: "Valor do Negócio (R$)", key: "value" },
              { id: "stage", label: "Etapa do Funil", key: "stage" },
              { id: "source", label: "Origem (Source)", key: "source" },
            ].map((field) => (
              <div key={field.id} className="p-3 border border-slate-100 rounded-xl flex flex-col space-y-1">
                <span className="text-[10px] font-bold text-slate-500 block">{field.label}</span>
                <select
                  value={mapping[field.id]}
                  onChange={(e) => handleMappingChange(field.id, Number(e.target.value))}
                  className="w-full text-xs p-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                >
                  <option value={-1}>-- Ignorar / Não possui --</option>
                  {csvHeaders.map((header, index) => (
                    <option key={index} value={index}>
                      Coluna {index + 1}: {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end pt-3">
            <button
              onClick={executeImport}
              disabled={isUploading}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-md shadow-emerald-600/10 transition-all flex items-center space-x-1.5"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirmar Importação de Leads</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
