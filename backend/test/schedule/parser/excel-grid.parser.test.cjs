const assert = require('node:assert/strict');
const test = require('node:test');
const XLSX = require('xlsx');

const { parseScheduleWorkbook } = require('../../../dist/schedule/parser/excel-grid.parser.js');

function createReportedScheduleWorkbook() {
    const grid = Array.from({ length: 29 }, () => Array(14).fill(null));
    grid[3][0] = 'На период с 26.10.26г. по 05.12.26г.';
    grid[4][0] = 'ГРУППА 384';
    grid[5][0] = 'ВРЕМЯ';
    grid[5][1] = '№';
    grid[5][2] = '26.окт.';
    grid[5][4] = 46328;
    grid[5][6] = 46335;

    grid[6][0] = 'ПОНЕДЕЛЬНИК';
    grid[6][1] = '1\n(08:30-10:00)';
    grid[6][2] = 'Системное программирование; практика; 1п/гр: преподаватель КазанцевМ.Ю./Web-технологии; практика; 2 п/гр: преподаватель ПупышевВ.А.';

    grid[21][0] = 'СРЕДА';
    grid[21][2] = '28.окт.';
    grid[21][4] = 46330;
    grid[21][6] = 46337;

    grid[24][1] = '3\n(12:00-13:30)';
    grid[24][2] = 'Обеспечение качества функционирования компьютерных систем; практика: 1п/гр; преподаватель БурумбаевД.И.';
    grid[24][6] = 'Обеспечение качества функционирования компьютерных систем; практика: 2п/гр; преподаватель БурумбаевД.И.';
    grid[25][1] = '4\n(14:15-15:45)';
    grid[25][6] = 'Обеспечение качества функционирования компьютерных систем; практика: 2п/гр; преподаватель БурумбаевД.И.';

    const worksheet = XLSX.utils.aoa_to_sheet(grid);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Расписание');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

test('parses the October 28 third pair as subgroup 1 without shifting adjacent weeks or pairs', () => {
    const parsed = parseScheduleWorkbook(createReportedScheduleWorkbook());
    const lessons = parsed.lessons.filter(
        (lesson) => lesson.dayOfWeek === 3 && lesson.startTime === '12:00',
    );

    assert.equal(parsed.groupName, '384');
    assert.deepEqual(
        parsed.lessons
            .filter((lesson) => lesson.dayOfWeek === 1 && lesson.startTime === '08:30')
            .map(({ weekStart, subgroup }) => ({ weekStart, subgroup })),
        [
            { weekStart: '26.10.2026', subgroup: 1 },
            { weekStart: '26.10.2026', subgroup: 2 },
        ],
    );
    assert.deepEqual(
        lessons.map(({ weekStart, subgroup, teacherName }) => ({
            weekStart,
            subgroup,
            teacherName,
        })),
        [
            {
                weekStart: '26.10.2026',
                subgroup: 1,
                teacherName: 'Бурумбаев Д.И.',
            },
            {
                weekStart: '09.11.2026',
                subgroup: 2,
                teacherName: 'Бурумбаев Д.И.',
            },
        ],
    );

    assert.deepEqual(
        parsed.lessons
            .filter((lesson) => lesson.dayOfWeek === 3 && lesson.startTime === '14:15')
            .map(({ weekStart, subgroup }) => ({ weekStart, subgroup })),
        [{ weekStart: '09.11.2026', subgroup: 2 }],
    );
});
