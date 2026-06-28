package de.hhn.labsw.laspoly.model.action;

import de.hhn.labsw.laspoly.model.Actor;

/**
 * Message send by an {@link de.hhn.labsw.laspoly.model.Actor}.
 */
public class Message implements Action {

    /**
     * Sender of the message.
     */
    private Actor sender;

    /**
     * Message itself.
     */
    private String message;


    /**
     * Constructor.
     *
     * @param messageActor Sender of the message.
     * @param mes          Message itself.
     */
    public Message(Actor messageActor, String mes) {
        sender = messageActor;
        message = mes;
    }

    @Override
    public void onAction() {
        // TODO send the message to the chat
    }

    @Override
    public boolean isActionValid() {
        return !message.equals("") && sender != null;
    }
}
