import type { Category } from '@ckd/shared/types/video'

interface CategoryFilterProps {
  categories: Category[]
  selected: Category | null
  onSelect: (category: Category | null) => void
  visible: boolean
}

const chipStyle = (isSelected: boolean): React.CSSProperties => ({
  background: isSelected ? '#9333EA' : '#F3E8FF',
  color: isSelected ? 'white' : '#9333EA',
  borderRadius: 20,
  padding: '6px 16px',
  fontFamily: "'Nunito', sans-serif",
  fontWeight: 600,
  fontSize: 13,
  border: 'none',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
})

export function CategoryFilter({ categories, selected, onSelect, visible }: CategoryFilterProps) {
  return (
    <div
      data-testid="category-filter"
      style={{ display: visible ? 'flex' : 'none', overflowX: 'auto', gap: 8, padding: '8px 16px' }}
    >
      <button
        data-testid="category-chip-All"
        style={chipStyle(selected === null)}
        onClick={() => onSelect(null)}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          data-testid={`category-chip-${cat}`}
          style={chipStyle(selected === cat)}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
