import { expect, test } from '@playwright/test'

test.describe('auth pages', () => {
  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/pt-BR/login')

    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/pt-BR/login')

    await page.locator('#email').fill('nobody@example.com')
    await page.locator('#password').fill('wrong-password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 15_000 })
  })

  test('register page loads', async ({ page }) => {
    await page.goto('/pt-BR/registro')

    await expect(page.locator('#firstName')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cadastrar' })).toBeVisible()
  })

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/pt-BR/esqueci-senha')

    await expect(page.locator('#email')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enviar instruções' })).toBeVisible()
  })

  test('unauthenticated user is redirected away from dashboard', async ({ page }) => {
    await page.goto('/pt-BR/dashboard')
    await expect(page).toHaveURL(/login/, { timeout: 15_000 })
  })
})
