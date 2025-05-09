import Image from 'next/image';

interface ImageBlockProps {
  src: string;
  alt: string;
  linkUrl?: string;
  publicId?: string;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  src,
  alt,
  linkUrl,
  publicId,
}) => {
  const ImageComponent = (
    <div className="relative w-full h-64">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );

  if (linkUrl) {
    return (
      <a href={linkUrl} target="_blank" rel="noopener noreferrer">
        {ImageComponent}
      </a>
    );
  }

  return ImageComponent;
}; 