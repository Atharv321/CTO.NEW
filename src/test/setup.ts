import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock HTMLMediaElement
Object.defineProperty(HTMLMediaElement.prototype, 'muted', {
  set: vi.fn(),
  get: vi.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  value: vi.fn(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  value: vi.fn(),
})

// Mock navigator.mediaDevices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn(),
  },
  configurable: true,
})
