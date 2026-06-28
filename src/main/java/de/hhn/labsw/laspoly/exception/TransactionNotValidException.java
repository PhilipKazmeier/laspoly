package de.hhn.labsw.laspoly.exception;

/**
 * Exception that is thrown if a {@link de.hhn.labsw.laspoly.model.action.Transaction} is not valid.
 */
public class TransactionNotValidException extends Exception {

    /**
     * Constructor of {@link java.lang.Exception}.
     *
     * @param message Exception message.
     */
    public TransactionNotValidException(String message) {
        super(message);
    }

}
