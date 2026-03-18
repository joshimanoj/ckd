import type { Category } from '@ckd/shared/types/video'

const labelMap: Record<string, string> = {
  Rhymes: '🎵 Rhymes',
  Colours: '🎨 Colours',
  Numbers: '🔢 Numbers',
  Animals: '🐘 Animals',
  Stories: '⭐ Exclusive',
}

interface CategoryFilterProps {
  categories: Category[]
  selected: Category | null
  onSelect: (category: Category | null) => void
  visible: boolean
}

export function CategoryFilter({ categories, selected, onSelect, visible }: CategoryFilterProps) {
  return (
    <div
      data-testid="category-filter"
      className="ckd-library__sticky"
      style={{ display: visible ? 'block' : 'none' }}
    >
      <div className="ckd-chip-row" style={{ padding: '10px 16px 4px' }}>
        <button
          data-testid="category-chip-All"
          className={`ckd-chip ${selected === null ? 'ckd-chip--active' : 'ckd-chip--inactive'}`}
          onClick={() => onSelect(null)}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            data-testid={`category-chip-${cat}`}
            className={`ckd-chip ${selected === cat ? 'ckd-chip--active' : 'ckd-chip--inactive'}`}
            onClick={() => onSelect(cat)}
          >
            {labelMap[cat] ?? cat}
          </button>
        ))}
      </div>
    </div>
  )
}
