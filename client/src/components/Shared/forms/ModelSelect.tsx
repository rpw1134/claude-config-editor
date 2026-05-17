import { fieldInput } from "./styles";

const KNOWN_MODELS = ["sonnet", "opus", "haiku"];

interface ModelSelectProps {
  value: string | undefined;
  onChange: (val: string | undefined) => void;
  disabled?: boolean;
}

export const ModelSelect = ({
  value,
  onChange,
  disabled,
}: ModelSelectProps) => {
  const isCustom =
    value !== undefined && value !== "" && !KNOWN_MODELS.includes(value);
  const selectValue = isCustom ? "__custom__" : (value ?? "");

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    if (v === "") onChange(undefined);
    else if (v === "__custom__") onChange("");
    else onChange(v);
  };

  return (
    <div className="flex flex-col gap-2">
      <select
        value={selectValue}
        onChange={handleSelectChange}
        disabled={disabled}
        className={fieldInput}
      >
        <option value="">Inherit — default</option>
        <option value="sonnet">sonnet</option>
        <option value="opus">opus</option>
        <option value="haiku">haiku</option>
        <option value="__custom__">Custom…</option>
      </select>
      {(selectValue === "__custom__" || isCustom) && (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="e.g. claude-opus-4-5"
          disabled={disabled}
          className={fieldInput}
        />
      )}
    </div>
  );
};
