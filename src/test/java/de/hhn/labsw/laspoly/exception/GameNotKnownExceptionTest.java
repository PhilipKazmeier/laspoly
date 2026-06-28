package de.hhn.labsw.laspoly.exception;

import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

/**
 * This test class test {@link GameNotKnownException}.
 */
@RunWith (Theories.class)
public class GameNotKnownExceptionTest {

    @DataPoints
    public static String[] messages = {"sample", "message"};

    @Theory
    public void testConstructor(final String message) {
        Exception exception = new GameNotKnownException(message);
        assertThat(exception.getMessage(), is(message));
    }

    @Test (expected = GameNotKnownException.class)
    public void testThrowException() throws GameNotKnownException {
        throw new GameNotKnownException(messages[0]);
    }
}
