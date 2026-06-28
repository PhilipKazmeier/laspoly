package de.hhn.labsw.laspoly.exception;

import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import java.util.ArrayList;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;

/**
 * This test class tests {@link BuildingConstructionException}.
 */
@RunWith(Theories.class)
public class BuildingConstructionExceptionTest {
    @DataPoints
    public static String[] messages = {"sample", "message"};

    @Theory
    public void testConstructor(final String message) {
        Exception exception = new BuildingConstructionException(null,message);
        assertThat(exception.getMessage(), is(message));
    }

    @Test(expected = BuildingConstructionException.class)
    public void testThrowException() {
        throw new BuildingConstructionException(new ArrayList<>(0),messages[0]);
    }
}
