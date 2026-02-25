import { CURRENCIES, type CurrencyCode } from "@/lib/requisition-types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  value: number | string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function CurrencyInput({ currency, onCurrencyChange, value, onValueChange, placeholder, className, readOnly }: CurrencyInputProps) {
  return (
    <div className={`flex gap-1.5 ${className || ""}`}>
      <Select value={currency} onValueChange={v => onCurrencyChange(v as CurrencyCode)}>
        <SelectTrigger className="w-24 bg-background border-border h-9 text-xs shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map(c => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-1.5">{c.flag} {c.code}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="number"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`bg-background border-border h-9 flex-1 ${readOnly ? "bg-muted text-muted-foreground" : ""}`}
      />
    </div>
  );
}

interface CurrencySelectProps {
  value: CurrencyCode;
  onChange: (c: CurrencyCode) => void;
  className?: string;
}

export function CurrencySelect({ value, onChange, className }: CurrencySelectProps) {
  return (
    <Select value={value} onValueChange={v => onChange(v as CurrencyCode)}>
      <SelectTrigger className={`bg-background border-border h-9 text-xs ${className || "w-28"}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CURRENCIES.map(c => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-1.5">{c.flag} {c.symbol} {c.code}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
