/*
 * Decompiled with CFR 0.152.
 */
package de.hhn.seb.labsw.laspoly.network.server.dao;

import de.hhn.seb.labsw.laspoly.exception.UserNotKnownException;
import de.hhn.seb.labsw.laspoly.model.User;
import java.util.List;

public interface UserDao {
    public List<User> getRegisteredUsers();

    public List<User> getLoggedInUsers();

    public void register(User var1);

    public void login(User var1) throws UserNotKnownException;

    public void logout(User var1) throws UserNotKnownException;

    public void changeUserData(User var1) throws UserNotKnownException;
}

