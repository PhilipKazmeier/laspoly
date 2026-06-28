package de.hhn.seb.labsw.laspoly.model.field;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FieldConfigurationTest {
    @Test
    void wrapPositionStaysOnMainTrack() {
        assertEquals(0, FieldConfiguration.wrapPosition(0, 0));
        assertEquals(2, FieldConfiguration.wrapPosition(39, 3));
        assertEquals(1, FieldConfiguration.wrapPosition(38, 3));
    }

    @Test
    void wrapPositionNeverLandsOnPrisonByRolling() {
        assertEquals(0, FieldConfiguration.wrapPosition(39, 1));
        assertEquals(39, FieldConfiguration.wrapPosition(0, 39));
    }
}
