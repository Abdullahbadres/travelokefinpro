const PlaceholderImage = ({ text, className = "", style = {} }) => {
    return (
      <div className={`placeholder-image ${className}`} style={style}>
        <div className="text-center p-4">
          <p className="font-medium">{text || "Image not available"}</p>
        </div>
      </div>
    )
  }
  
  export default PlaceholderImage
  