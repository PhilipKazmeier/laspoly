package de.hhn.labsw.laspoly.model.action;

import de.hhn.labsw.laspoly.model.Player;
import de.hhn.labsw.laspoly.model.User;
import org.junit.Test;
import org.junit.experimental.theories.DataPoints;
import org.junit.experimental.theories.Theories;
import org.junit.experimental.theories.Theory;
import org.junit.runner.RunWith;

import java.util.Locale;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

/**
 * This test class tests {@link de.hhn.labsw.laspoly.model.action.Message}.
 */
@RunWith (Theories.class)
public class MessageTest {

    @DataPoints
    public static Player[] players = {new Player(new User("Name", Locale.GERMAN, 0)), new Player(new User("Philip",
            Locale.ENGLISH, 0)), new Player(new User("Brian", Locale.GERMAN, 0)), new Player(new User("Patrick",
            Locale.ENGLISH, 0))};

    @DataPoints
    public static String[] messages = {"Message", "Funny", "Testing is fun", "LasPoly for the win"};

    @Theory
    public void testIsActionValid(Player player, String message) {
        Message mes = new Message(player, message);
        assertTrue(mes.isActionValid());
    }

    @Test
    public void testIsActionValidErrorTest() {
        Message mes = new Message(null, "");
        assertFalse(mes.isActionValid());
    }


}
