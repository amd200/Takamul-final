import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AdjustmentsProvider } from "@/context/AdjustmentsContext";
import { ExpensesProvider } from "@/context/ExpensesContext";
import { SalesProvider } from "@/context/SalesContext";
import { PurchasesProvider } from "@/context/PurchasesContext";
import { SuppliersProvider } from "@/context/SuppliersContext";
import { QuotesProvider } from "@/context/QuotesContext";
import { UsersProvider } from "@/context/UsersContext";
import { BanksProvider } from "@/context/BanksContext";
import { TransfersProvider } from "@/context/TransfersContext";
import { PromotionsProvider } from "@/context/PromotionsContext";
import { PaymentCompaniesProvider } from "@/context/PaymentCompaniesContext";
import { PaymentMethodsProvider } from "@/context/PaymentMethodsContext";
import { LogoProvider } from "@/context/LogoContext";
import { CurrenciesProvider } from "@/context/CurrenciesContext";
import { CustomerGroupsProvider } from "@/context/CustomerGroupsContext";
import { PriceGroupsProvider } from "@/context/PriceGroupsContext";
import { CategoriesProvider } from "@/context/CategoriesContext";
import { ExpenseCategoriesProvider } from "@/context/ExpenseCategoriesContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { UserGroupsProvider } from "@/context/UserGroupsContext";
import { DeliveryCompaniesProvider } from "@/context/DeliveryCompaniesContext";
import { DelegatesProvider } from "@/context/DelegatesContext";
import { TablesProvider } from "@/context/TablesContext";
import { AdditionsProvider } from "@/context/AdditionsContext";
import { WarehousesProvider } from "@/context/WarehousesContext";
import QueryProvider from "./providers/query-provider.tsx";

import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

import { DirectionProvider } from "@/components/ui/direction";
import { ProductsProvider } from "./context/ProductsContext.tsx";
import { PosProvider } from "./context/PosContext.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { initAuth } from "./lib/initAuth.ts";

initAuth().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <DirectionProvider dir="rtl" direction="rtl">
        <QueryProvider>
          <BrowserRouter>
            <ThemeProvider>
              <LanguageProvider>
                  <AdjustmentsProvider>
                    <ExpensesProvider>
                      <SalesProvider>
                        <PurchasesProvider>
                          <ExpenseCategoriesProvider>
                            <QuotesProvider>
                              <UsersProvider>
                                <BanksProvider>
                                  <TransfersProvider>
                                    <PromotionsProvider>
                                      <PaymentCompaniesProvider>
                                        <PaymentMethodsProvider>
                                          <LogoProvider>
                                            <CurrenciesProvider>
                                              <CustomerGroupsProvider>
                                                <UserGroupsProvider>
                                                  <CategoriesProvider>
                                                    <DeliveryCompaniesProvider>
                                                      <DelegatesProvider>
                                                        <TablesProvider>
                                                          <AdditionsProvider>
                                                            <WarehousesProvider>
                                                              <PriceGroupsProvider>
                                                                <TooltipProvider>
                                                                  <App />
                                                                </TooltipProvider>
                                                              </PriceGroupsProvider>
                                                            </WarehousesProvider>
                                                          </AdditionsProvider>
                                                        </TablesProvider>
                                                      </DelegatesProvider>
                                                    </DeliveryCompaniesProvider>
                                                  </CategoriesProvider>
                                                </UserGroupsProvider>
                                              </CustomerGroupsProvider>
                                            </CurrenciesProvider>
                                          </LogoProvider>
                                        </PaymentMethodsProvider>
                                      </PaymentCompaniesProvider>
                                    </PromotionsProvider>
                                  </TransfersProvider>
                                </BanksProvider>
                              </UsersProvider>
                            </QuotesProvider>
                          </ExpenseCategoriesProvider>
                        </PurchasesProvider>
                      </SalesProvider>
                    </ExpensesProvider>
                  </AdjustmentsProvider>
              </LanguageProvider>
            </ThemeProvider>
          </BrowserRouter>
        </QueryProvider>
      </DirectionProvider>
    </StrictMode>,
  );
});
