interface TitleBlockProps {
  content: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
}

export const TitleBlock: React.FC<TitleBlockProps> = ({
  content,
  fontSize = 32,
  fontWeight = 'bold',
  fontStyle = 'normal',
  textAlign = 'left',
}) => {
  return (
    <h2
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        fontStyle,
        textAlign: textAlign as 'left' | 'center' | 'right',
      }}
    >
      {content}
    </h2>
  );
}; 