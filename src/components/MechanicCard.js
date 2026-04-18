export default function MechanicCard({ data, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow h-32 flex overflow-hidden hover:shadow-md transition cursor-pointer"
    >
      <div className="p-4 w-2/3">
        <h2 className="font-semibold text-base">{data.name}</h2>
        <p className="text-sm text-gray-500">{data.rating} Rating</p>
        <p className="text-xs text-gray-600 mt-1">{data.desc}</p>
      </div>
      <div className="relative w-1/3">
        <img src={data.image} alt={data.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white"></div>
      </div>
    </div>
  );
}
