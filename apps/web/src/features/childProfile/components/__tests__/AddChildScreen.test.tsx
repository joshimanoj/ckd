import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddChildScreen } from '../AddChildScreen'

vi.mock('../../../../assets/creator-photo.jpg', () => ({ default: 'creator-photo.jpg' }))

describe('AddChildScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders heading, input, pills and CTA', () => {
    render(<AddChildScreen />)
    expect(screen.getByTestId('child-profile-screen')).toBeInTheDocument()
    expect(screen.getByText("Add your child's profile")).toBeInTheDocument()
    expect(screen.getByText("We'll personalise the experience for them")).toBeInTheDocument()
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Date of birth/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('pill-under-3')).toBeInTheDocument()
    expect(screen.getByTestId('pill-3-4')).toBeInTheDocument()
    expect(screen.getByTestId('pill-5-6')).toBeInTheDocument()
    expect(screen.getByTestId('start-watching-btn')).toBeInTheDocument()
    expect(screen.getByTestId('top-nav')).toBeInTheDocument()
  })

  it('button is disabled when name and age are empty', () => {
    render(<AddChildScreen />)
    expect(screen.getByTestId('start-watching-btn')).toBeDisabled()
  })

  it('button stays disabled when only name is filled', () => {
    render(<AddChildScreen />)
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Arjun' } })
    expect(screen.getByTestId('start-watching-btn')).toBeDisabled()
  })

  it('button stays disabled when only age is selected', () => {
    render(<AddChildScreen />)
    fireEvent.click(screen.getByTestId('pill-3-4'))
    expect(screen.getByTestId('start-watching-btn')).toBeDisabled()
  })

  it('button is enabled when name and age are both provided', () => {
    render(<AddChildScreen />)
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: 'Arjun' } })
    fireEvent.click(screen.getByTestId('pill-3-4'))
    expect(screen.getByTestId('start-watching-btn')).not.toBeDisabled()
  })

  it('button stays disabled when name is whitespace only', () => {
    render(<AddChildScreen />)
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: '   ' } })
    fireEvent.click(screen.getByTestId('pill-under-3'))
    expect(screen.getByTestId('start-watching-btn')).toBeDisabled()
  })

  it('selecting a pill deselects the previous one', () => {
    render(<AddChildScreen />)
    fireEvent.click(screen.getByTestId('pill-under-3'))
    expect(screen.getByTestId('pill-under-3')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByTestId('pill-3-4'))
    expect(screen.getByTestId('pill-under-3')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('pill-3-4')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onSave with trimmed name and selected age on submit', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<AddChildScreen onSave={onSave} />)
    fireEvent.change(screen.getByTestId('name-input'), { target: { value: '  Arjun  ' } })
    fireEvent.click(screen.getByTestId('pill-5-6'))
    fireEvent.click(screen.getByTestId('start-watching-btn'))
    expect(onSave).toHaveBeenCalledWith('Arjun', '5-6')
  })

  it('shows saving state when saving prop is true', () => {
    render(<AddChildScreen saving={true} />)
    expect(screen.getByTestId('start-watching-btn')).toHaveTextContent('Saving...')
    expect(screen.getByTestId('start-watching-btn')).toBeDisabled()
  })

  it('shows error toast when error prop is set', () => {
    render(<AddChildScreen error="Couldn't save profile. Try again." />)
    expect(screen.getByTestId('error-toast')).toBeInTheDocument()
    expect(screen.getByTestId('error-toast')).toHaveTextContent("Couldn't save profile. Try again.")
  })

  it('does not show error toast when error is null', () => {
    render(<AddChildScreen error={null} />)
    expect(screen.queryByTestId('error-toast')).not.toBeInTheDocument()
  })

  it('prefills child details in edit mode', () => {
    render(
      <AddChildScreen
        initialName="Aarav"
        initialAgeRange="3-4"
        title="Edit your child's profile"
        submitLabel="Save Changes"
      />,
    )

    expect(screen.getByDisplayValue('Aarav')).toBeInTheDocument()
    expect(screen.getByText("Edit your child's profile")).toBeInTheDocument()
    expect(screen.getByTestId('pill-3-4')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('start-watching-btn')).toHaveTextContent('Save Changes')
  })
})
