package de.hhn.labsw.laspoly.exception;

import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theory;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

/**
 * This class tests {@link de.hhn.labsw.laspoly.exception.TransactionNotValidException}.
 */
public class TransactionNotValidExceptionTest {

    @DataPoints
    public static String[] messages = {"sample", "message"};

    @Theory
    public void testConstructor(final String message) {
        Exception exception = new TransactionNotValidException(message);
        assertThat(exception.getMessage(), is(message));
    }

    @Test (expected = TransactionNotValidException.class)
    public void testThrowException() throws TransactionNotValidException {
        throw new TransactionNotValidException(messages[0]);
    }
}
