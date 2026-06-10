# Projekty — spis treści (przypięty)

W tej dyskusji znajdziesz listę wszystkich projektów, które buduję. Gdy wrzucasz pomysł, odnieś się do konkretnego projektu — pomoże mi szybciej zrozumieć kontekst.

---

## TorekMarketKiller (~33 900 LOC)
**Platforma do automatyzacji handlu TradingView → MT5. Multi-terminal lokalnie i zdalnie.**

Alerty z TradingView przelatują przez FastAPI i Cloudflare Tunnel, lądują jako realne transakcje na wielu terminalach. Cerebrus monitoruje statystyki, Wyrocznia optymalizuje parametry, watchdog pilnuje terminali.

*Pomysły mile widziane:* nowe funkcje tradingowe, integracje z brokerami, ulepszenia UI, pomysły na dashboardy.

---

## PortfolioCommandCenter (~6 700 LOC)
**Symulator portfela strategii. Optymalizacja GA+ILS, Walk-Forward, koszty transakcyjne.**

Testuje strategie w warunkach laboratoryjnych — optymalizacja genetyczna, symulacje Walk-Forward, testy odporności. Zbudowany żeby nie ryzykować prawdziwych pieniędzy przed walidacją.

*Pomysły mile widziane:* nowe metryki oceny, dodatkowe algorytmy optymalizacji, formaty danych wejściowych.

---

## CandleComparison (~500 LOC)
**Porównanie danych świecowych MT5 vs TradingView. Tick size, time shift.**

Sprawdza czy dane z brokera zgadzają się z tym co widzi TradingView. Auto-detekcja formatu CSV.

*Pomysły mile widziane:* wsparcie dla nowych formatów, dodatkowe metryki porównania.

---

## CandleDownloader (~370 LOC)
**Pobieranie danych świecowych z TradingView przez WebSocket.**

Eksport do CSV, interwały od 1 min do monthly. Reverse-engineered protokół WebSocket TV.

*Pomysły mile widziane:* nowe źródła danych, dodatkowe formaty eksportu.

---

## ClientCreator (~1 100 LOC)
**Narzędzie do budowania klientów .exe. W toku.**

Kompilacja PyInstaller, podpisywanie kodu, auto-update przez GitHub Releases.

*Pomysły mile widziane:* wsparcie dla innych platform, dodatkowe opcje budowania.

---

## Strona tmk-tunnel.pl
**Ta strona — portfolio i hub społeczności.**

Zbudowana czystym HTML/CSS/JS, hostowana na Cloudflare Pages.

*Pomysły mile widziane:* ulepszenia UI/UX, nowe sekcje, integracje.

---

**Jak wrzucić pomysł:**
1. Kliknij "New discussion" w kategorii Ideas
2. W tytule podaj nazwę projektu, np. `[TMK] Pomysł na X`
3. Opisz szczegółowo — im więcej konkretów, tym większa szansa że to zbuduję
