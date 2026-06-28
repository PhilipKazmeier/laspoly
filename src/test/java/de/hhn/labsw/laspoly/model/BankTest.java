package de.hhn.labsw.laspoly.model;

import org.junit.Test;

import static org.junit.Assert.assertNotNull;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.Bank}.
 */
public class BankTest {
    @Test
    public void testConstructor () {
        Bank bank = new Bank();
        assertNotNull(bank);
    }
}
