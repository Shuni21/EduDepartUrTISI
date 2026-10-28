const assert = require('node:assert/strict');
const test = require('node:test');

const { ScheduleGateway } = require('../../dist/schedule/schedule.gateway.js');

function createGateway() {
    const gateway = new ScheduleGateway();
    let emittedRooms = null;
    gateway.server = {
        to(rooms) {
            emittedRooms = rooms;
            return { emit() {} };
        },
    };

    return {
        gateway,
        get emittedRooms() { return emittedRooms; },
    };
}

test('accepts room identities containing multiple rooms separated by slash or comma', () => {
    for (const identity of ['303/311 УК1', '403, 412 УК1']) {
        const gatewayFixture = createGateway();
        const { gateway } = gatewayFixture;

        gateway.broadcastScheduleChanged(
            { reason: 'schedule-uploaded' },
            [{ type: 'room', identity }],
        );

        assert.deepEqual(gatewayFixture.emittedRooms, [
            `schedule:room:${encodeURIComponent(identity.toUpperCase())}`,
        ]);
    }
});

test('rejects empty, overlong, or control-character schedule identities', () => {
    const { gateway } = createGateway();

    for (const identity of ['', '   ', 'x'.repeat(201), 'room\nname', 'room\u007fname']) {
        assert.throws(
            () => gateway.broadcastScheduleChanged(
                { reason: 'schedule-uploaded' },
                [{ type: 'room', identity }],
            ),
            /Invalid schedule identity/,
        );
    }
});
