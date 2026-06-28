package de.hhn.labsw.laspoly.exception;

import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

/**
 * This test class tests {@link UserNotKnownException}.
 */
@RunWith (Theories.class)
public class UserNotKnownExceptionTest {

    @DataPoints
    public static String[] messages = {"sample", "message"};

    @Theory
    public void testConstructor(final String message) {
        Exception exception = new UserNotKnownException(message);
        assertThat(exception.getMessage(), is(message));
    }

    @Test (expected = UserNotKnownException.class)
    public void testThrowException() throws UserNotKnownException {
        throw new UserNotKnownException(messages[0]);
    }
}
