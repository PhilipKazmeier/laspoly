package de.hhn.labsw.laspoly.exception;

/**
 * Exception thrown if the server doesn't know a {@link de.hhn.labsw.laspoly.model.User}.
 */
public class UserNotKnownException extends Exception {

    /**
     * Constructor of {@link java.lang.Exception}.
     *
     * @param message Exception message.
     */
    public UserNotKnownException (String message) {
        super(message);
    }
}
