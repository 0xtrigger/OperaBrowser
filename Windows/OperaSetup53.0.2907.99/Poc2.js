<script>
    let cnt = 0;
    let reg = /./g;
    reg.exec = () => {
        if (cnt++ == 0)
            return { length: 0xfffffffe };

        cnt = 0;
        return null;
    };

    ''.replace(reg, () => { });
</script>
