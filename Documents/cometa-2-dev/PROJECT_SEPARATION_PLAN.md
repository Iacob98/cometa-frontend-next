# COMETA Project Separation Plan

## Анализ текущего состояния

В данном каталоге находятся **МИНИМУМ 4 проекта**, которые перемешаны и создают беспорядок:

1. **🚀 Next.js Frontend** - Современное веб-приложение (основная разработка)
2. **📱 React Native Mobile Apps** - 2 мобильных приложения
3. **🏛️ Streamlit Legacy Apps** - Старые приложения на Python/Streamlit (admin + worker)
4. **⚡ FastAPI Microservices** - Бэкенд микросервисы

## 📁 План разделения на репозитории/папки

### 1. 🚀 **cometa-frontend-nextjs** (Основной приоритет)
```
Статус: ✅ Готов к выделению
Технологии: Next.js 15.5.3 + React 19.1.0 + FastAPI microservices
```

**Файлы для переноса:**
```
📁 cometa-frontend-clean/ (полностью)
├── src/app/                    # Next.js App Router
├── src/components/             # React компоненты
├── src/hooks/                  # Custom hooks
├── src/types/                  # TypeScript типы
├── package.json               # Next.js зависимости
├── next.config.ts             # Next.js конфигурация
├── tailwind.config.js         # Styling
├── tsconfig.json              # TypeScript config
├── .taskmaster/               # Task Master AI
├── docker-compose.yml         # Next.js specific
├── Dockerfile                 # Next.js container
└── все конфиг файлы

📁 fastapi_services/ (полностью)
├── auth_service/              # Authentication
├── project_service/           # Project management
├── work_service/              # Work entries
├── team_service/              # Team management
├── material_service/          # Material tracking
├── equipment_service/         # Equipment management
├── activity_service/          # Activity logging
├── gateway/                   # API Gateway
└── shared/                    # Shared utilities

📁 shared/ (полностью)
├── models.py                  # SQLAlchemy models
├── database.py                # Database config
├── auth.py                    # Auth utilities
└── translations.py            # i18n

Корневые файлы:
├── docker-compose.yml         # Full stack orchestration
├── .env.example              # Environment template
├── init.sql                  # Database schema
├── CLAUDE.md                 # Development context
├── .mcp.json                 # MCP configuration
└── README.md (новый)
```

**Исключить из переноса:**
- `admin_app/` (legacy)
- `worker_app/` (legacy)
- `mobile-app/` (отдельный проект)
- `COMETAMobileApp/` (отдельный проект)
- `worker_mobile_app/` (отдельный проект)

---

### 2. 📱 **cometa-mobile-react-native** (Мобильная разработка)
```
Статус: ⚠️ 2-3 приложения в одной папке - нужно разделить
Технологии: React Native 0.74.5 + TypeScript
```

**Приложение 1: COMETAMobileApp (Рабочее)**
```
📁 COMETAMobileApp/ (полностью)
├── src/                       # React Native источники
├── android/                   # Android настройки
├── ios/                       # iOS настройки
├── package.json              # React Native зависимости
├── react-native.config.js    # RN конфигурация
├── tsconfig.json             # TypeScript
├── metro.config.js           # Bundler config
├── babel.config.js           # Babel config
└── app.json                  # App metadata
```

**Приложение 2: mobile-app (TypeScript проект?)**
```
⚠️ Внимание: Это не React Native приложение!
📁 mobile-app/
└── package.json (показывает TypeScript compiler, не mobile app)
```

**Приложение 3: worker_mobile_app**
```
📁 worker_mobile_app/ (если это отдельное приложение)
├── ...подлежит анализу...
```

**Рекомендация:**
- Создать `cometa-mobile-worker` для COMETAMobileApp
- Разобраться с `mobile-app/` - возможно это ошибочная папка
- `worker_mobile_app/` проанализировать отдельно

---

### 3. 🏛️ **cometa-legacy-streamlit** (Постепенная миграция)
```
Статус: 🚨 Готов к выделению, но планируется замена на Next.js
Технологии: Python 3.11+ + Streamlit 1.48+
```

**Файлы для переноса:**
```
📁 admin_app/ (полностью)
├── pages/                     # Streamlit pages
├── activity_monitoring/       # Activity modules
├── document_management/       # Document modules
├── project_preparation/       # Project modules
├── resource_management/       # Resource modules
├── resource_requests/         # Request handling
├── app.py                    # Main Streamlit app
├── requirements.txt          # Python deps
├── Dockerfile               # Container config
└── все модули и утилиты

📁 worker_app/ (полностью)
├── pages/                     # Worker pages
├── app.py                    # Worker Streamlit app
├── requirements.txt          # Python deps
├── Dockerfile               # Container config
└── утилиты

Поддерживающие файлы:
├── shared/                   # Shared с Next.js (ссылки)
├── migrations/               # Database migrations
├── start_admin.sh           # Launch scripts
├── start_worker.sh          # Launch scripts
├── start_all.sh             # Launch scripts
├── admin_guide.md           # Documentation
├── user_guide.md            # Documentation
└── house_work_guide.md      # Documentation
```

**Долгосрочный план:** Постепенная замена на Next.js функциональность

---

### 4. 🔧 **cometa-utilities** (Вспомогательные инструменты)
```
Статус: 📦 Утилиты и инструменты разработки
```

**Файлы для переноса:**
```
Анализ и очистка:
├── analyze_dependencies.py
├── analyze_usage.py
├── final_cleanup.py
├── import_analyzer.py
├── dependency_analysis.json
├── import_analysis_data.json

Миграции:
├── run_document_migration.py
├── run_schema_migration.py
├── migrate_to_supabase.py
├── project_preparation_functions_simple.py

Тестирование:
├── test_models_connection.py
├── analyze_missing_tables.py
├── add_missing_columns_to_models.py
├── add_missing_table_models.py
├── final_model_sync.py
├── tests/ (папка)

Докери и конфигурация:
├── docker-test.sh
├── Dockerfile.admin
├── .dockerignore

Документация:
├── DEPLOYMENT_GUIDE.md
├── DOCKER.md
├── STORAGE_GUIDE.md
├── technical-specifications/
├── plan.md
└── database_sync_report.md
```

---

## 🎯 Рекомендуемая структура проектов

### Вариант A: Отдельные репозитории
```
📁 cometa-frontend-nextjs/     ← Основная разработка
📁 cometa-mobile-worker/       ← React Native приложение
📁 cometa-legacy-streamlit/    ← Legacy (для миграции)
📁 cometa-dev-utilities/       ← Утилиты разработки
```

### Вариант B: Монорепозиторий с раздельными папками
```
📁 cometa-monorepo/
├── apps/
│   ├── frontend-nextjs/       ← Next.js + FastAPI
│   ├── mobile-worker/         ← React Native
│   └── legacy-streamlit/      ← Python/Streamlit
├── packages/
│   ├── shared-types/         ← Общие TypeScript типы
│   ├── shared-models/        ← SQLAlchemy модели
│   └── dev-utilities/        ← Утилиты разработки
└── package.json              ← Workspace config
```

## ✅ Рекомендуемый план действий

### Этап 1: Создание основного фронтенд проекта (Приоритет 1)
```bash
mkdir cometa-frontend-nextjs
cd cometa-frontend-nextjs

# Копировать ключевые компоненты
cp -r ../cometa-frontend-clean/* .
cp -r ../fastapi_services/ .
cp -r ../shared/ .
cp ../docker-compose.yml .
cp ../.env.example .
cp ../init.sql .
cp ../CLAUDE.md .
cp ../.mcp.json .

# Создать новый README.md с описанием архитектуры
# Обновить docker-compose для убирания legacy services
```

### Этап 2: Выделение мобильного приложения (Приоритет 2)
```bash
mkdir cometa-mobile-worker
cd cometa-mobile-worker

# Копировать только реальное React Native приложение
cp -r ../COMETAMobileApp/* .

# Очистить и настроить конфигурацию
# Создать отдельный README.md
```

### Этап 3: Архивация legacy приложений (Приоритет 3)
```bash
mkdir cometa-legacy-streamlit
cd cometa-legacy-streamlit

# Копировать legacy компоненты
cp -r ../admin_app/ .
cp -r ../worker_app/ .
cp -r ../migrations/ .
cp ../start_*.sh .
cp ../*_guide.md .

# Создать план миграции на Next.js
```

### Этап 4: Утилиты разработки (Приоритет 4)
```bash
mkdir cometa-dev-utilities
cd cometa-dev-utilities

# Копировать инструменты разработки
cp ../analyze_*.py .
cp ../test_*.py .
cp ../add_*.py .
cp ../final_*.py .
cp ../*_analysis*.json .
cp -r ../tests/ .
cp -r ../technical-specifications/ .
```

## ⚠️ Критически важные моменты

### Общие файлы, которые нужны везде:
- `shared/models.py` - SQLAlchemy модели (синхронизированы с PostgreSQL)
- `shared/database.py` - Подключение к базе
- `shared/auth.py` - Система аутентификации
- `.env.example` - Шаблон переменных окружения

### База данных:
- **PostgreSQL база** - общая для всех приложений
- **FastAPI микросервисы** - API слой для всех фронтендов
- **Модели синхронизированы** - 63 таблицы = 63 модели ✅

### Docker конфигурация:
- Next.js проект может использовать полный `docker-compose.yml`
- Legacy проекты - урезанную версию только с PostgreSQL
- Mobile - работает независимо (эмулятор/устройство)

## 💡 Итоговые рекомендации

**Для чистой разработки рекомендую:**

1. **Начать с `cometa-frontend-nextjs`** - основной проект на Next.js + FastAPI
2. **Выделить `cometa-mobile-worker`** - React Native приложение
3. **Оставить legacy** в отдельной папке для миграции
4. **Утилиты** - в отдельном проекте для инструментов

**Преимущества такого разделения:**
- ✅ Чистый git history для каждого проекта
- ✅ Независимые релизы и версионирование
- ✅ Раздельные CI/CD pipeline
- ✅ Команды могут работать независимо
- ✅ Меньше конфликтов при merge
- ✅ Проще onboarding новых разработчиков