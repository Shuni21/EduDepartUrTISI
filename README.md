# EduDepartUrTISI

Веб-приложение для учебного отдела **УрТИСИ СибГУТИ** (Уральский технический институт связи и информатики).

Система предназначена для удобной работы с расписанием занятий: загрузка, парсинг, редактирование, разрешение конфликтов, уведомления и администрирование.

**Демо:** [edu-depart-urtisi.vercel.app](https://edu-depart-urtisi.vercel.app)

---

## Возможности

- Загрузка и автоматический парсинг файлов расписания (Excel)
- Просмотр и редактирование расписания
- Drag & Drop перенос пар
- Автоматическое обнаружение и разрешение конфликтов
- Рекомендации по переносу пар
- Работа со связанными группами и лекциями
- Консультации преподавателей
- Предпраздничные изменения расписания
- Система уведомлений (включая real-time через WebSocket)
- Админ-панель:
  - Управление пользователями
  - Академическая структура (группы, курсы и т.д.)
  - Сессии
  - История загрузок расписания
- Тёмная тема
- Адаптивный интерфейс

---

## Используемые технологии

### Языки и основные технологии

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![NodeJS](https://img.shields.io/badge/node.js-%236DA55F.svg?style=for-the-badge&logo=node.js&logoColor=white)

### Frontend

![Vue.js](https://img.shields.io/badge/vue.js-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-%23FFD859.svg?style=for-the-badge&logo=vue.js&logoColor=black)
![Vue Router](https://img.shields.io/badge/Vue%20Router-%234FC08D.svg?style=for-the-badge&logo=vue.js&logoColor=white)
![Axios](https://img.shields.io/badge/axios-%235A29E4.svg?style=for-the-badge&logo=axios&logoColor=white)
![Socket.io](https://img.shields.io/badge/socketdotio-%23010101.svg?style=for-the-badge&logo=socketdotio&logoColor=white)

### Backend

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeORM](https://img.shields.io/badge/TypeORM-%23FE0803.svg?style=for-the-badge&logo=typeorm&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-%23000000.svg?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Passport](https://img.shields.io/badge/Passport-%2334E27A.svg?style=for-the-badge&logo=passport&logoColor=white)
![Socket.io](https://img.shields.io/badge/socketdotio-%23010101.svg?style=for-the-badge&logo=socketdotio&logoColor=white)

### Инструменты и инфраструктура

![npm](https://img.shields.io/badge/npm-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/github%20actions-%232671E5.svg?style=for-the-badge&logo=githubactions&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

---

## Технологический стек

### Frontend
- **Vue 3** + TypeScript
- **Vite**
- **Pinia** (state management)
- **Vue Router**
- **Tailwind CSS**
- **Socket.IO Client**
- **Axios**

### Backend
- **NestJS**
- **TypeORM** + PostgreSQL
- **JWT + Passport** (аутентификация)
- **Socket.IO** (real-time)
- **xlsx** (парсинг Excel)
- **web-push** (push-уведомления)
- **Sharp** (обработка изображений)

### Инфраструктура
- npm workspaces (монорепозиторий)
- GitHub Actions (CI)

---

## Структура проекта

```text
EduDepartUrTISI/
├── frontend/                         # Клиентская часть — Vue 3
│   ├── src/
│   │   ├── api/                      # Работа с API
│   │   ├── components/               # Переиспользуемые компоненты
│   │   ├── views/                    # Страницы приложения
│   │   ├── stores/                   # Pinia-хранилища
│   │   ├── composables/              # Переиспользуемая логика
│   │   ├── router/                   # Маршрутизация
│   │   ├── types/                    # TypeScript-типы
│   │   └── ...
│   ├── public/                       # Статические файлы
│   └── ...
│
├── backend/                          # Серверная часть — NestJS
│   ├── src/
│   │   ├── academic/                 # Академическая структура
│   │   ├── auth/                     # Аутентификация и авторизация
│   │   ├── schedule/                 # Работа с расписанием
│   │   │   ├── dto/                  # DTO расписания
│   │   │   ├── entities/             # Сущности базы данных
│   │   │   ├── parser/               # Обработка файлов Excel
│   │   │   ├── resolver/             # Поиск и сопоставление данных
│   │   │   └── ...
│   │   ├── users/                    # Пользователи
│   │   ├── sessions/                 # Управление пользовательскими сессиями
│   │   └── ...
│   ├── uploads/                      # Загруженные файлы
│   └── ...
│
├── package.json                      # Корневые скрипты проекта
└── README.md                         # Документация проекта