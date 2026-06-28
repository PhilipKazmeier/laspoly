/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.model.action;

import de.hhn.seb.labsw.laspoly.model.User;
import de.hhn.seb.labsw.laspoly.model.action.Action;
import de.hhn.seb.labsw.laspoly.model.action.ActionType;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

public class SwapOfferAction
extends Action {
    private final User sender;
    private User receiver;
    private final List<Integer> senderProperties;
    private final List<Integer> receiverProperties;
    private int senderMoney;
    private int receiverMoney;
    private Status status;

    public void setReceiver(User receiver) {
        this.receiver = receiver;
    }

    public SwapOfferAction(User actuator, User swapSender, User swapReceiver) {
        super(ActionType.SWAP_OFFER, actuator);
        this.sender = swapSender;
        this.receiver = swapReceiver;
        this.senderProperties = new ArrayList<Integer>();
        this.receiverProperties = new ArrayList<Integer>();
        this.senderMoney = 0;
        this.receiverMoney = 0;
        this.status = Status.OPEN;
    }

    public User getSender() {
        return this.sender;
    }

    public User getReceiver() {
        return this.receiver;
    }

    public Collection<Integer> getSenderProperties() {
        return Collections.unmodifiableList(this.senderProperties);
    }

    public void setSenderProperties(int ... items) {
        this.senderProperties.clear();
        int[] nArray = items;
        int n = nArray.length;
        for (int i = 0; i < n; ++i) {
            Integer i2 = nArray[i];
            this.senderProperties.add(i2);
        }
    }

    public void addSenderProperties(int ... items) {
        for (int item : items) {
            this.senderProperties.add(item);
        }
    }

    public void removeSenderProperties(int ... items) {
        for (int item : items) {
            this.senderProperties.remove(item);
        }
    }

    public void addReceiverProperties(int ... items) {
        for (int item : items) {
            this.receiverProperties.add(item);
        }
    }

    public void removeReceiverProperties(int ... items) {
        for (int item : items) {
            this.receiverProperties.remove(item);
        }
    }

    public List<Integer> getReceiverProperties() {
        return Collections.unmodifiableList(this.receiverProperties);
    }

    public void setReceiverProperties(int ... items) {
        this.receiverProperties.clear();
        int[] nArray = items;
        int n = nArray.length;
        for (int i = 0; i < n; ++i) {
            Integer i2 = nArray[i];
            this.receiverProperties.add(i2);
        }
    }

    public int getSenderMoney() {
        return this.senderMoney;
    }

    public void setSenderMoney(int money) {
        this.senderMoney = money;
    }

    public int getReceiverMoney() {
        return this.receiverMoney;
    }

    public void setReceiverMoney(int money) {
        this.receiverMoney = money;
    }

    public Status getStatus() {
        return this.status;
    }

    public void setStatus(Status s) {
        this.status = s;
    }

    @Override
    public String toString() {
        StringBuffer sb = new StringBuffer("de.hhn.seb.labsw.laspoly.model.action.SwapOfferAction{");
        sb.append("status=").append(this.status);
        sb.append(", senderProperties=").append(this.senderProperties);
        sb.append(", senderMoney=").append(this.senderMoney);
        sb.append(", sender=").append(this.sender);
        sb.append(", receiverProperties=").append(this.receiverProperties);
        sb.append(", receiverMoney=").append(this.receiverMoney);
        sb.append(", receiver=").append(this.receiver);
        sb.append('}');
        return sb.toString();
    }

    public static enum Status {
        OPEN,
        SENT,
        CHANGED_BY_RECEIVER,
        CHANGED_BY_SENDER,
        DECLINED_BY_RECEIVER,
        DECLINED_BY_SENDER,
        ACCEPTED,
        EDITING_BY_RECEIVER,
        EDITING_BY_SENDER;

    }
}

