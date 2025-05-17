import { Link } from "react-router-dom"
import PlaceholderImage from "./PlaceholderImage"

const PromoCard = ({ promo }) => {
  return (
    <Link to={`/promo/${promo.id}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] h-full">
        <div className="relative h-48">
          {promo.imageUrl ? (
            <img
              src={promo.imageUrl || "/placeholder.svg"}
              alt={promo.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none"
                e.target.nextSibling.style.display = "flex"
              }}
            />
          ) : null}
          <PlaceholderImage
            text={promo.title}
            className="w-full h-full"
            style={{ display: promo.imageUrl ? "none" : "flex" }}
          />

          {/* Promo badge */}
          <div className="absolute top-2 left-2 bg-[#FF7757] text-white px-3 py-1 rounded-full text-sm font-medium">
            {promo.promo_code}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold mb-1 truncate">{promo.title}</h3>
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">{promo.description}</p>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#FF7757] font-bold">Save Rp{promo.promo_discount_price.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Min. purchase: Rp{promo.minimum_claim_price.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default PromoCard
