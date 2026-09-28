import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '../context/AuthContext'
import { BankProvider, FullBankGate, CustomQuestionsProvider } from '../context/BankContext'
import { FavoritesProvider } from '../context/FavoritesContext'
import { MasteryProvider } from '../context/MasteryContext'
import { SessionProvider } from '../context/SessionContext'
import { VerdictProvider } from '../context/InterviewContext'

/**
 * 与 main.tsx 相同的 Provider 嵌套（不含 AuthGate 门禁与 Theme，组件测试不依赖它们）。
 * 需要全量题库的页面统一包在 FullBankGate 里，与 App.tsx 的路由门禁一致。
 */
export function renderWithProviders(ui: ReactElement, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <CustomQuestionsProvider>
          <BankProvider>
            <FavoritesProvider>
              <MasteryProvider>
                <VerdictProvider>
                  <SessionProvider>
                    <FullBankGate>{ui}</FullBankGate>
                  </SessionProvider>
                </VerdictProvider>
              </MasteryProvider>
            </FavoritesProvider>
          </BankProvider>
        </CustomQuestionsProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}
