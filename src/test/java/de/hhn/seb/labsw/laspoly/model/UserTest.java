package de.hhn.seb.labsw.laspoly.model;

import java.util.Locale;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UserTest {
    @Test
    void equalsUsesIdWhenRegistered() {
        User left = new User("alice", Locale.ENGLISH);
        left.setId(7);
        User right = new User("bob", Locale.ENGLISH);
        right.setId(7);
        assertEquals(left, right);
    }

    @Test
    void differentIdsAreNotEqual() {
        User left = new User("alice", Locale.ENGLISH);
        left.setId(1);
        User right = new User("bob", Locale.ENGLISH);
        right.setId(2);
        assertFalse(left.equals(right));
    }

    @Test
    void unregisteredUsersCompareByName() {
        User left = new User("alice", Locale.ENGLISH);
        User right = new User("bob", Locale.ENGLISH);
        assertFalse(left.equals(right));
        assertEquals(left, new User("Alice", Locale.ENGLISH));
    }
}
