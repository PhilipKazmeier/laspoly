/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import org.joda.time.DateTime;

public class MessageAction
extends Action {
    private final User sender;
    private final String message;
    private final DateTime time;

    public MessageAction(User messageSender, String mes, User actuator) {
        super(ActionType.MESSAGE, actuator);
        this.sender = messageSender;
        this.message = mes;
        this.time = new DateTime();
    }

    public User getSender() {
        return this.sender;
    }

    public String getMessage() {
        return this.message;
    }

    public DateTime getTime() {
        return this.time;
    }

    @Override
    public String toString() {
        return this.getClass().getName() + "{" + "sender=" + this.sender + ", message='" + this.message + '\'' + ", time=" + this.time + '}';
    }
}

