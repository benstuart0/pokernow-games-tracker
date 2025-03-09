interface AliasListProps {
  aliases: string[];
  setAliases: (aliases: string[]) => void;
  isResults: boolean;
  onUpdateAliases?: () => void;
}

export default function AliasList({
  aliases,
  setAliases,
  isResults,
  onUpdateAliases,
}: AliasListProps) {
  const handleRemoveAlias = (index: number) => {
    const newAliases = aliases.filter((_, i) => i !== index);
    setAliases(newAliases);
    if (isResults && onUpdateAliases) {
      onUpdateAliases();
    }
  };

  return (
    <div className="alias-list">
      {aliases.map((alias, index) => (
        <div key={alias} className="alias-tag">
          {alias}
          <span
            className="remove-alias"
            title="Remove alias"
            onClick={() => handleRemoveAlias(index)}
          >
            ✕
          </span>
        </div>
      ))}
    </div>
  );
} 