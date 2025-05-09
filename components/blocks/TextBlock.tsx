interface TextBlockProps {
  content: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  content,
  fontSize = 16,
  fontWeight = 'normal',
  fontStyle = 'normal',
  textAlign = 'left',
}) => {
  return (
    <p
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        fontStyle,
        textAlign: textAlign as 'left' | 'center' | 'right',
      }}
    >
      {content}
    </p>
  );
}; 