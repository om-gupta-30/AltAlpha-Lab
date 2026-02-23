function SectionHeader({ title, subtitle, icon }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {icon && <span className="text-2xl">{icon}</span>}
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-500">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export default SectionHeader
