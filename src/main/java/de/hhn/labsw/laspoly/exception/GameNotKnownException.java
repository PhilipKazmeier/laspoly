package de.hhn.labsw.laspoly.exception;

/**
 * Exception thrown if the server doesn't know a {@link de.hhn.labsw.laspoly.model.Game}.
 */
public class GameNotKnownException extends Exception {

    /**
     * Constructor of {@link java.lang.Exception}.
     *
     * @param message Exception message.
     */
    public GameNotKnownException(String message) {
        super(message);
    }

}
